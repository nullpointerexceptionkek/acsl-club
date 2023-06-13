<script lang="ts">
  function scrollDown() {
    let descriptionElement = document.getElementById("description");
    if (descriptionElement) {
      descriptionElement.scrollIntoView({ behavior: "smooth" });
    }
  }
</script>

<button class="scroll-down-btn" on:click={scrollDown}>⮟</button>

<style lang="scss">
  .scroll-down-btn {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    cursor: pointer;
    font-size: 2em;
    background-color: rgba(255, 255, 255, 0.5);
    border: none;
    border-radius: 50%;
    padding: 0.5em;
    transition: background-color 0.5s;
  }

  .scroll-down-btn:hover {
    background-color: rgba(255, 255, 255, 1);
  }
</style>
