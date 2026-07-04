const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

/** Extracts the video ID from common YouTube URL shapes and returns an
 *  embeddable URL, or null if the string isn't a recognizable YouTube link. */
export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(YOUTUBE_ID_PATTERN);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}
