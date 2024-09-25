import { Server } from 'hyper-express';


import { setTimeout } from 'timers/promises';
import { tempFileMiddleware } from './tempFile.middleware';

const server = new Server({
  max_body_length: 10333 * 1024 * 1024,
});




server.post("/", tempFileMiddleware, async (req, res) => {
  console.log(req.file);


  await setTimeout(5000);

  res.status(200).json({
    success: true
  })
})

server.listen(3000, () => {
  console.log('Server started on port 3000');
})