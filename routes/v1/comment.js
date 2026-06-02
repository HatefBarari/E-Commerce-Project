const express = require("express");
const { auth } = require("./../../middlewares/auth");
const roleGuard = require("./../../middlewares/roleGuard");
const {
  createComment,
  getComments,
  getAllComments,
  updateComment,
  deleteComment,
  addReply,
  updateReply,
  deleteReply,
} = require("./../../controllers/v1/comment");

const router = express.Router();

router.route("/").get(getComments).post(auth, createComment);

router.route("/all").get(auth, roleGuard("ADMIN"), getAllComments);

router
  .route("/:commentId")
  .patch(auth, updateComment)
  .delete(auth, roleGuard("ADMIN"), deleteComment);

router.route("/:commentId/reply").post(auth, addReply);

router
  .route("/:commentId/reply/:replyId")
  .patch(auth, updateReply)
  .delete(auth, deleteReply);

module.exports = router;
