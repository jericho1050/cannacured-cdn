import { Server } from 'hyper-express';
import { handleAttachmentsPostRoute } from './routes/attachmentsPost';
import { handleVerifyPostRoute } from './routes/verifyPost';
import { handleAvatarsPostRoute } from './routes/avatarPost';
import { handleBannersPostRoute } from './routes/bannerPost';
import { handleEmojisPostRoute } from './routes/emojiPost';
import { handleDeleteFileRoute } from './routes/deleteFile';
import { handleGetFileRoute } from './routes/getFile';


const server = new Server();

handleGetFileRoute(server);
handleAttachmentsPostRoute(server)
handleVerifyPostRoute(server)
handleAvatarsPostRoute(server)
handleBannersPostRoute(server)
handleEmojisPostRoute(server)
handleDeleteFileRoute(server)


server.listen(3000, () => {
  console.log('Server started on port 3000');
})




