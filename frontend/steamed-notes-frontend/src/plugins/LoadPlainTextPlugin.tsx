import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot, $createParagraphNode, $createTextNode, $createLineBreakNode } from 'lexical';

type LoadPlainTextPluginProps = {
  initialText: string;
};

export const LoadPlainTextPlugin = ({ initialText }: LoadPlainTextPluginProps) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();

      const paragraph = $createParagraphNode();
      const lines = initialText.split('\n');
      for (const line of lines) {
        paragraph.append($createTextNode(line));
        paragraph.append($createLineBreakNode())
      }
      paragraph.getLastDescendant()?.selectEnd()

      paragraph.getLastDescendant()?.remove()
      root.append(paragraph);

    }
    );

  }, [editor]);

  return null;
};

