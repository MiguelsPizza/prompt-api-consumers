import DOMPurify from "dompurify";
import { marked } from "marked";

export const renderMarkdown = (content: string) => {
  try {
    const rawHtml = marked(content) as string;
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
    });
    return sanitizedHtml;
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return '';
  }
};
