<script lang="ts">
  import { onMount } from "svelte";
  import Title from "./Title.svelte";
  import ScrollDown from "./ScrollDown.svelte";

</script>

<main class="app-container">
  <Title />
  <ScrollDown/>
  <div id="description" class="description">
    <h1>ACSL Club</h1>
  </div>
</main>

<style lang="scss">
  .app-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }

  #description {
    margin-top: 50px;
  }
</style>
