// Shared between the compose form (client, fills the message textarea when a
// product is picked) and the admin settings form (server, shows/edits the
// default). Kept placeholder-based rather than a fixed "name + link" format
// so staff can reorder/add fixed text (hashtags, a fixed intro line, etc.)
// without needing a code change.
export const DEFAULT_SOCIAL_POST_TEMPLATE = "{ten}\n{link}\n\n";

export function renderSocialPostTemplate(template: string, vars: { ten: string; link: string }): string {
  return template.replaceAll("{ten}", vars.ten).replaceAll("{link}", vars.link);
}
