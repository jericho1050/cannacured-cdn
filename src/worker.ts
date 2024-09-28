import { Server } from 'hyper-express';
import { handleAttachmentsPostRoute } from './routes/attachmentsPost';
import { handleVerifyPostRoute } from './routes/verifyPost';
import { handleAvatarsPostRoute } from './routes/avatarPost';
import { handleBannersPostRoute } from './routes/bannerPost';
import { handleEmojisPostRoute } from './routes/emojiPost';


const server = new Server();

handleAttachmentsPostRoute(server)
handleVerifyPostRoute(server)
handleAvatarsPostRoute(server)
handleBannersPostRoute(server)
handleEmojisPostRoute(server)



server.get("/index.html", (req, res) => {
  res.send(`
    
    <html>
    <input type="file" id="file" />
    <button id="submit">Upload</button>

    <script>
      const file = document.getElementById('file')
      const submit = document.getElementById('submit')

      submit.addEventListener('click', async () => {
      console.log("sending...")
        const formData = new FormData()
        formData.append('file', file.files[0])

        const response = await fetch('/attachments/1', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        console.log(result)

      })

    </script>
    </html>
    
    `)
})

server.listen(3000, () => {
  console.log('Server started on port 3000');
})




