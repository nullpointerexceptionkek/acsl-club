<script lang="ts">
  import Title from "./Title.svelte";
  import ScrollDown from "./ScrollDown.svelte";
  import Navbar from "./Navbar.svelte";
  import Description from "./Description.svelte";
</script>

<main class="app-container">
  <Navbar />
  <Title />
  <ScrollDown />
  <Description id="description" />
</main>

<style lang="scss">
  .app-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 1200px;
    margin: auto;
    padding: 2em 1em;
    font-family: "Roboto", sans-serif;
    color: #333;
    line-height: 1.6;
  }

</style>
