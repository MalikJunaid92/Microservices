import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

const handleEvent = (type, data) => {
  if (type === "PostCreated") {
    const { id, title } = data;
    // Initialize the post with an empty comments array
    posts[id] = { id, title, comments: [] };
  }

  if (type === "CommentCreated") {
    const { id, content, postId, status } = data;
    const post = posts[postId];

    if (post) {
      post.comments.push({ id, content, status });
    } else {
      console.error(`Post with id ${postId} does not exist for CommentCreated event`);
    }
  }

  if (type === "CommentUpdated") {
    const { id, content, postId, status } = data;
    const post = posts[postId];

    if (post) {
      const comment = post.comments.find((comment) => comment.id === id);
      if (comment) {
        comment.status = status;
        comment.content = content;
      } else {
        console.error(`Comment with id ${id} not found in post ${postId}`);
      }
    } else {
      console.error(`Post with id ${postId} does not exist for CommentUpdated event`);
    }
  }
};

app.get("/posts", (req, res) => {
  res.send(posts);
});

app.post("/events", (req, res) => {
  const { type, data } = req.body;

  handleEvent(type, data);

  res.send({});
});

app.listen(4002, async () => {
  console.log("Listening on 4002");
  try {
    const res = await axios.get("http://localhost:4005/events");

    for (let event of res.data) {
      console.log("Processing event:", event.type);
      handleEvent(event.type, event.data);
    }
  } catch (error) {
    console.log(error.message);
  }
});
