import { Server } from 'hyper-express';
import redis from 'redis';
import { tempFileMiddleware } from './tempFile.middleware';


const redisClient = redis.createClient({});

const server = new Server({
  max_body_length: 10333 * 1024 * 1024,
});


let numbers = "0123456789";
function isValidGroupId(groupId?: string) {
  if (!groupId) {
    return false;
  }

  for (let i = 0; i < groupId.length; i++) {
    if (!numbers.includes(groupId[i]!)) {
      return false;
    }
  }

  return true;
}


// groupId can:
// - be a userId for posts
// - channelId for messages
server.post("/:groupId", tempFileMiddleware, async (req, res) => {
  if (!isValidGroupId(req.params.groupId)) {
    res.status(400).json({
      error: "Invalid groupId"
    })
    return;
  }



  res.status(200).json(req.file)
})

server.listen(3000, () => {
  console.log('Server started on port 3000');
})




