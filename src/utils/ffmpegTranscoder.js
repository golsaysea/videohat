import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const FFMPEG_CORE_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';

let ffmpeg;
let loading;

const getFFmpeg = async (onProgress) => {
  if (!ffmpeg) ffmpeg = new FFmpeg();
  if (!ffmpeg.loaded) {
    if (!loading) {
      onProgress?.(0, '加载 MP4 转码器');
      loading = ffmpeg.load({
        coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm', true, ({ received, total }) => {
          if (total > 0) onProgress?.(Math.min(0.3, (received / total) * 0.3), '下载 MP4 转码器');
        }),
      });
    }
    await loading;
  }
  return ffmpeg;
};

export const transcodeWebmToMp4 = async (webmBlob, { fps = 30, quality = 'high', onProgress } = {}) => {
  const instance = await getFFmpeg(onProgress);
  const inputName = `input_${Date.now()}.webm`;
  const outputName = `output_${Date.now()}.mp4`;
  const crf = { high: '20', medium: '23', low: '28' }[quality] || '23';
  const videoBitrate = { high: '8M', medium: '5M', low: '2500k' }[quality] || '5M';

  const progressHandler = ({ progress }) => {
    if (Number.isFinite(progress)) onProgress?.(0.3 + Math.max(0, Math.min(0.68, progress * 0.68)), '转码 MP4');
  };

  instance.on('progress', progressHandler);
  try {
    await instance.writeFile(inputName, await fetchFile(webmBlob));

    let code = await instance.exec([
      '-fflags', '+genpts',
      '-i', inputName,
      '-map', '0:v:0',
      '-map', '0:a?',
      '-r', String(fps || 30),
      '-fps_mode', 'cfr',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', crf,
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', '192k',
      outputName,
    ]);

    if (code !== 0) {
      await instance.deleteFile(outputName).catch(() => {});
      code = await instance.exec([
        '-fflags', '+genpts',
        '-i', inputName,
        '-map', '0:v:0',
        '-map', '0:a?',
        '-r', String(fps || 30),
        '-fps_mode', 'cfr',
        '-c:v', 'mpeg4',
        '-b:v', videoBitrate,
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-c:a', 'aac',
        '-b:a', '192k',
        outputName,
      ]);
    }

    if (code !== 0) throw new Error(`FFmpeg exited with code ${code}`);

    const data = await instance.readFile(outputName);
    onProgress?.(1, 'MP4 转码完成');
    return new Blob([data.buffer], { type: 'video/mp4' });
  } finally {
    instance.off('progress', progressHandler);
    await instance.deleteFile(inputName).catch(() => {});
    await instance.deleteFile(outputName).catch(() => {});
  }
};
export const transcodeInputVideoToMp4 = async (videoFile, { onProgress } = {}) => {
  const instance = await getFFmpeg(onProgress);
  const extension = videoFile.name.split('.').pop()?.toLowerCase() || 'mov';
  const inputName = `source_${Date.now()}.${extension}`;
  const outputName = `source_${Date.now()}.mp4`;

  const progressHandler = ({ progress }) => {
    if (Number.isFinite(progress)) onProgress?.(0.3 + Math.max(0, Math.min(0.68, progress * 0.68)), '转换实拍素材');
  };

  instance.on('progress', progressHandler);
  try {
    onProgress?.(0, '读取实拍素材');
    await instance.writeFile(inputName, await fetchFile(videoFile));
    const code = await instance.exec([
      '-i', inputName,
      '-map', '0:v:0',
      '-map', '0:a?',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', '160k',
      outputName,
    ]);
    if (code !== 0) throw new Error(`FFmpeg exited with code ${code}`);
    const data = await instance.readFile(outputName);
    onProgress?.(1, '实拍素材转换完成');
    return new File([data.buffer], videoFile.name.replace(/\.[^.]+$/, '') + '.mp4', { type: 'video/mp4' });
  } finally {
    instance.off('progress', progressHandler);
    await instance.deleteFile(inputName).catch(() => {});
    await instance.deleteFile(outputName).catch(() => {});
  }
};
