import { Server } from 'hyper-express';
import redis from 'redis';
import { tempFileMiddleware } from './tempFile.middleware';
import { validGroupIdCheckMiddleware } from './validGroupIdCheck.middleware';


const redisClient = redis.createClient({});

const server = new Server({
  max_body_length: 10333 * 1024 * 1024,
});





// groupId can:
// - be a userId for posts
// - channelId for messages
server.post("/:groupId", validGroupIdCheckMiddleware, tempFileMiddleware, async (req, res) => {




  res.status(200).json(req.file)
})

server.listen(3000, () => {
  console.log('Server started on port 3000');
})




