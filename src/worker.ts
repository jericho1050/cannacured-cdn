import { Server } from 'hyper-express';
import { handleAttachmentsPostRoute } from './routes/attachmentsPost';
import { handleVerifyPostRoute } from './routes/verifyPost';
import { handleAvatarsPostRoute } from './routes/avatars';
import { handleBannersPostRoute } from './routes/bannerPost';


const server = new Server();

handleAttachmentsPostRoute(server)
handleVerifyPostRoute(server)
handleAvatarsPostRoute(server)
handleBannersPostRoute(server)


server.listen(3000, () => {
  console.log('Server started on port 3000');
})




