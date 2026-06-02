const { errorResponse, successResponse } = require("../../helpers/responses");
const { createPaginationData } = require("../../utils/index");
const Product = require("./../../models/Product");
const Comment = require("./../../models/Comment");
const {
  createCommentValidator,
  addReplyValidator,
  updateCommentValidator,
} = require("./../../validators/comment");
const { isValidObjectId } = require("mongoose");

exports.getComments = async (req, res, next) => {
  try {
    const { productId } = req.query;

    if (!isValidObjectId(productId)) {
      return errorResponse(res, 400, "Product ID is not correct !!");
    }

    const comments = await Comment.find({
      product: productId,
    })
      .populate("user")
      .populate({
        path: "replies",
        populate: {
          path: "user",
        },
      });

    return successResponse(res, 200, comments);
  } catch (err) {
    next(err);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const user = req.user;
    const { rating, content, productId } = req.body;

    await createCommentValidator.validate(
      { productId, content, rating },
      {
        abortEarly: false,
      }
    );

    const product = await Product.findOne({ _id: productId });
    if (!product) {
      return errorResponse(res, 404, "Product not found !!");
    }

    const newComment = await Comment.create({
      product: productId,
      user: user._id,
      rating,
      content,
      replies: [],
    });

    return successResponse(res, 201, {
      comment: newComment,
      message: "Comment created successfully :))",
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const comments = await Comment.find()
      .sort({
        createdAt: "desc",
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("product")
      .populate("user", "-addresses")
      .populate({
        path: "replies",
        populate: { path: "user", select: "-addresses" },
      });

    const totalComments = await Comment.countDocuments();

    return successResponse(res, 200, {
      comments,
      pagination: createPaginationData(page, limit, totalComments, "Comments"),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content, rating } = req.body;
    const user = req.user;

    await updateCommentValidator.validate(
      { content, rating },
      {
        abortEarly: false,
      }
    );

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return errorResponse(res, 404, "Comment not found !!");
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, "You have not access to this action !!");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        content,
        rating,
      },
      { new: true }
    );

    return successResponse(res, 200, {
      message: "Comment updated successfully :))",
      comment: updatedComment,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
      return errorResponse(res, 400, "Comment ID is not correct !!");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if (!this.deleteComment) {
      return errorResponse(res, 400, "Comment not found !!");
    }

    return successResponse(res, 200, {
      message: "Comment deleted successfully :))",
      comment: deletedComment,
    });
  } catch (err) {
    next(err);
  }
};

exports.addReply = async (req, res, next) => {
  try {
    const user = req.user;
    const { commentId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(commentId)) {
      return errorResponse(res, 400, "Comment ID is not correct !!");
    }

    await addReplyValidator.validate({ content }, { abortEarly: false });

    const reply = await Comment.findByIdAndUpdate(
      commentId,
      {
        $push: {
          replies: {
            content,
            user: user._id,
          },
        },
      },
      { new: true }
    );

    if (!reply) {
      return errorResponse(res, 404, "Comment not found !!");
    }

    return successResponse(res, 200, { reply });
  } catch (err) {
    next(err);
  }
};

exports.updateReply = async (req, res, next) => {
  try {
    // Codes
  } catch (err) {
    next(err);
  }
};

exports.deleteReply = async (req, res, next) => {
  try {
    const { commentId, replyId } = req.params;
    const user = req.user;

    if (!isValidObjectId(commentId) || !isValidObjectId(replyId)) {
      return errorResponse(res, 400, "Comment or Reply id is not correct !!");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return errorResponse(res, 404, "Comment not found !!");
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return errorResponse(res, 404, "Reply not found !!");
    }

    if (reply.user.toString() !== user._id.toString()) {
      return errorResponse(res, 403, "You have not access to this action !!");
    }

    comment.replies.pull(replyId);
    await comment.save();

    return successResponse(res, 200, {
      message: "Reply deleted successfully :))",
    });
  } catch (err) {
    next(err);
  }
};
