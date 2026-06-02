const { errorResponse, successResponse } = require("../../helpers/responses");
const Note = require("./../../models/Note");
const Product = require("./../../models/Product");
const { createPaginationData } = require("./../../utils/index");

exports.getNotes = async (req, res, next) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10 } = req.query;

    const notes = await Note.find({ user: user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("product")
      .lean();

    let notedProducts = [];
    for (const note of notes) {
      if (note.product) {
        const product = {
          ...note.product,
          note: {
            _id: note._id,
            content: note.content,
            createdAt: note.createdAt,
          },
        };

        notedProducts.push(product);
      } else {
        await Note.findOneAndDelete({ _id: note._id });
      }
    }

    const userTotalNotes = await Note.countDocuments({ user: user._id });

    return successResponse(res, 200, {
      products: notedProducts,
      pagination: createPaginationData(page, limit, userTotalNotes, "Notes"),
    });
  } catch (err) {
    next(err);
  }
};

exports.addNote = async (req, res, next) => {
  try {
    const { productId, content } = req.body;
    const user = req.user;

    const product = await Product.findById(productId);

    if (!product) {
      return errorResponse(res, 400, "Product not found !!");
    }

    //* Validator

    const existingNote = await Note.findOne({
      user: user._id,
      product: productId,
    });

    if (existingNote) {
      return errorResponse(
        res,
        400,
        "Another note already exist for this product"
      );
    }

    const newNote = await Note.create({
      user: user._id,
      product: productId,
      content,
    });

    return successResponse(res, 201, {
      message: "Note created successfully :))",
      note: newNote,
    });
  } catch (err) {
    next(err);
  }
};

exports.getNote = async (req, res, next) => {
  try {
    const user = req.user;
    const { noteId } = req.params;

    const note = await Note.findById(noteId)
      .populate("user")
      .populate("product")
      .lean();

    if (note?.user?._id.toString() !== user._id.toString()) {
      return errorResponse(
        res,
        404,
        "Note not found on you have not access to this note"
      );
    }

    if (!note.product) {
      await Note.findByIdAndDelete(noteId);
      return errorResponse(res, 404, "This product has been removed !!");
    }

    const product = {
      ...note.product,
      note: {
        _id: note._id,
        content: note.content,
        createdAt: note.createdAt,
      },
    };

    return successResponse(res, 200, {
      product,
    });
  } catch (err) {
    next(err);
  }
};

exports.editNote = async (req, res, next) => {
  try {
    const user = req.user;
    const { noteId } = req.params;
    const { content } = req.body;

    const existingNote = await Note.findById(noteId);

    if (existingNote?.user.toString() !== user._id.toString()) {
      return errorResponse(
        res,
        404,
        "Note not found or you have not access to it"
      );
    }

    const updatedNote = await Note.findByIdAndUpdate(
      noteId,
      {
        content,
      },
      { new: true }
    );

    return successResponse(res, 200, {
      note: updatedNote,
      message: "Note updated successfully :))",
    });
  } catch (err) {
    next(err);
  }
};

exports.removeNote = async (req, res, next) => {
  try {
    const user = req.user;
    const { noteId } = req.params;

    const existingNote = await Note.findById(noteId);

    if (!existingNote || existingNote.user.toString() !== user._id.toString()) {
      return errorResponse(
        res,
        404,
        "Note not found or you have not access to it"
      );
    }

    const deletedNote = await Note.findByIdAndDelete(noteId);

    return successResponse(res, 200, {
      message: "Note removed successfully :))",
      note: deletedNote,
    });
  } catch (err) {
    next(err);
  }
};
