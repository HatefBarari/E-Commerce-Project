const express = require("express");
const { auth } = require("./../../middlewares/auth");
const {
  getNotes,
  addNote,
  getNote,
  editNote,
  removeNote,
} = require("./../../controllers/v1/note");

const router = express.Router();

router.route("/").get(auth, getNotes).post(auth, addNote);

router
  .route("/:noteId")
  .get(auth, getNote)
  .put(auth, editNote)
  .delete(auth, removeNote);

module.exports = router;
