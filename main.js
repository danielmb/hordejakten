import axios from 'axios';
import fs from 'fs';
import path from 'path';
const streamUrl = 'https://bsstorm.horde.no/hls/stream.m3u8';
const m3u8Url = `https://bsstorm.horde.no/hls/`;
setInterval(async () => {
  let { data } = await axios.get(streamUrl);
  let stream = data.split('\n').filter((line) => line.endsWith('.ts'));
  for (let i = 0; i < stream.length; i++) {
    let ts = stream[i];
    let url = `${m3u8Url}${ts}`;
    let filename = ts.split('/').pop();
    await downloadIfNotExists(url, filename);
  }
}, 3000);
export async function downloadFile(fileUrl, outputLocationPath) {
  const writer = fs.createWriteStream(outputLocationPath);

  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then((response) => {
    //ensure that the user can call `then()` only when the file has
    //been downloaded entirely.

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on('error', (err) => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          const info = {
            downloadTimeUTC: new Date().toUTCString(),
            // with time zone offset
            downloadTime: new Date().toString(),
            path: outputLocationPath,
          };
          // combine the filename with .info.json
          const infoPath = path.join(
            path.dirname(outputLocationPath),
            path.basename(outputLocationPath) + '.info.json',
          );
          fs.writeFileSync(infoPath, JSON.stringify(info));
          resolve(true);
        }
        //no need to call the reject here, as it will have been called in the
        //'error' stream;
      });
    });
  });
}

let downloadIfNotExists = async (url, filename) => {
  const path = `./video/${filename}`;
  // download file
  if (fs.existsSync(path)) return;
  await downloadFile(url, path);
  console.log('downloaded', filename);
};
