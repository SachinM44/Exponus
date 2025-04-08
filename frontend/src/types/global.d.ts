// Add declaration for @heroicons/react modules
declare module '@heroicons/react/24/outline' {
  import { ComponentType, SVGProps } from 'react';
  
  export const HandThumbUpIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const HandThumbDownIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ChatBubbleOvalLeftIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ShareIcon: ComponentType<SVGProps<SVGSVGElement>>;
  // Add other icons as needed
}

declare module 'react-markdown' {
  import { FC } from 'react';
  
  interface ReactMarkdownProps {
    children: string;
    className?: string;
    components?: Record<string, unknown>;
  }
  
  const ReactMarkdown: FC<ReactMarkdownProps>;
  export default ReactMarkdown;
} 