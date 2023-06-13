<script lang="ts">
  import Title from "./Title.svelte";
  import ScrollDown from "./ScrollDown.svelte";

</script>

<main class="app-container">
  <Title />
  <ScrollDown/>
  <div id="description" class="description">
    <div>
      <span class="bigLogo">A</span>
      <span class="smallLogo">merican</span>
      <span class="bigLogo">C</span>
      <span class="smallLogo">omputer</span>
      <span class="bigLogo">S</span>
      <span class="smallLogo">cience</span>
      <span class="bigLogo">L</span>
      <span class="smallLogo">eague</span>
      <span class="bigLogo">Club</span>
    </div>
    <h1>What is ACSL?</h1>
    <p>
      "American Computer Science League (ACSL) organizes computer programming and 
      computer science contests for K-12 schools, organizations 
      and local groups". It is a form of competitive programming that is less competitive than USACO.
      There is Mutiple choice question and programming question on the contest to challenge your skill.
    </p>
    <h1>What is ACSL Club?</h1>
    <p>
      Founded by a group of passionate students, ACSL Club is a club that aims to bring competitive programming to high school
    </p>
    <h1>What do we do?</h1>
    <p>
      We will be hosting weekly meetings to teach you the basics of competitive programming and prepare you for the ACSL contest.
    </p>
    <h1>How many hours of dedication is needed?</h1>

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

  .bigLogo {
    font-size: 90px;
    font-weight: bold;
    font-family: 'Roboto', sans-serif;
    color: #F44336;
  }

  .smallLogo {
    font-size: 20px;
    font-weight: normal;
    font-family: 'Roboto', sans-serif;
    color: #FF5722;
  }

  #description {
    margin-top: 50px;
  }
</style>
