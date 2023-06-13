<script lang="ts">
  import { onMount } from 'svelte';

  let index = 0;
  const messages = [
    'out.println("message")',
    'console.log("message");',
    'cout << "message";',
    'print("message")',
    'puts "message"',
    'echo "message"',
  ];

  let currentMessage = messages[index];
  let message = 'Welcome to ACSL Club!';
  let displayedMessage = '';

  let typingTimer: number;

  onMount(() => {
    let messageSwitchTimer: number;

    if (!displayedMessage) {
      let i = 0;
      typingTimer = setInterval(() => {
        if (i < message.length) {
          displayedMessage = message.substring(0, i + 1);
          i++;
        } else {
          clearInterval(typingTimer);
        }
      }, Math.random() * 300 + 100); // typing speed
    }

    messageSwitchTimer = setInterval(() => {
      index = (index + 1) % messages.length;
      currentMessage = messages[index];
    }, 5000);

    return () => {
      clearInterval(typingTimer);
      clearInterval(messageSwitchTimer);
    };
  });
</script>

<style lang="scss">
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 98vh;
    font-size: 5em;
    font-family: 'Roboto', sans-serif;
    transition: all 1s ease;
    text-align: center;
    line-height: 1.5;
    padding: 0 20px;
  }

  .highlight {
    background: linear-gradient(90deg, #EE7752, #E73C7E, #23A6D5, #23D5AB);
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
  }

  @keyframes blink {
    50% {
      color: transparent;
    }
  }
</style>

<div class="container">
  {#if displayedMessage}
    {#each currentMessage.split('message') as part, i}
      {#if i > 0}
        <span class="highlight">{displayedMessage}</span>{part}
      {:else}
        {part}
      {/if}
    {/each}
  {/if}
</div>
