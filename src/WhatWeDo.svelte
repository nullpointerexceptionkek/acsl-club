<script lang="ts">
  import { onMount } from "svelte";
  import { EditorState } from "@codemirror/state";
  import { EditorView } from "@codemirror/view";
  import { cpp } from '@codemirror/lang-cpp';
  import { basicSetup } from '@codemirror/basic-setup';

  let editor: EditorView;

  function initCodeMirror(): void {
    const state = EditorState.create({
      doc: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!";\n    return 0;\n}`,
      extensions: [
        basicSetup,
        cpp(),
      ],
    });

    editor = new EditorView({
      state,
      parent: document.getElementById("editor-container") as HTMLElement,
    });
  }

  onMount(() => {
    initCodeMirror();
  });
</script>

<div id="editor-container"></div>

<style>
  #editor-container {
    height: 400px;
  }
</style>
