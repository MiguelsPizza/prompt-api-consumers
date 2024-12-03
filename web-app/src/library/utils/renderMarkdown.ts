// import DOMPurify from 'dompurify';
// import { marked, MarkedOptions } from 'marked';
// import hljs from 'highlight.js';

// // Configure marked with syntax highlighting
// const markedOptions: MarkedOptions = {
//   renderer: new marked.Renderer(),
//   langPrefix: 'hljs language-',  // This is important for highlight.js
//   highlight: (code: string, lang: string) => {
//     if (lang && hljs.getLanguage(lang)) {
//       try {
//         return hljs.highlight(code, { language: lang }).value;
//       } catch (err) {
//         console.error(err);
//       }
//     }
//     return code;
//   },
//   breaks: true,
//   gfm: true,
// };

// marked.setOptions(markedOptions);

// export const renderMarkdown = (content: string) => {
//   try {
//     const rawHtml = marked(content) as string;
//     const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
//       USE_PROFILES: { html: true },
//     });
//     return sanitizedHtml;
//   } catch (error) {
//     console.error('Error rendering markdown:', error);
//     return '';
//   }
// };
