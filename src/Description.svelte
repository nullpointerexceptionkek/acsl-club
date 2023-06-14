<script>
    export let id;
  </script>
  
  <div id={id} class="description">
    <div class="logo-section">
      <span class="bigLogo">A</span>
      <span class="smallLogo">merican</span>
      <span class="bigLogo">C</span>
      <span class="smallLogo">omputer</span>
      <span class="bigLogo">S</span>
      <span class="smallLogo">cience</span>
      <span class="bigLogo">L</span>
      <span class="smallLogo">eague</span>
    </div>
    <section id="discover-acsl">
      <h1>Discover ACSL</h1>
      <p>
        The American Computer Science League (ACSL) organizes computer
        programming and computer science contests for K-12 students, bridging
        schools, organizations, and local groups. ACSL offers a form of
        competitive programming that is less competitive than USACO, featuring
        multiple choice and programming questions to challenge your skills.
      </p>
    </section>
    <section id="introducing-acsl-club">
      <h1>Introducing ACSL Club</h1>
      <p>
        The ACSL Club is an initiative by a group of enthusiastic students with
        a mission to foster competitive programming within high school.
      </p>
    </section>
    <section id="our-activities">
      <h1>Our Activities</h1>
      <p>
        Our club conducts weekly meetings where we cover the fundamentals of
        competitive programming and equip you for ACSL contests.
      </p>
    </section>
    <section id="time-commitment">
      <h1>Time Commitment</h1>
      <p>
        We understand that you have a busy schedule. The weekly meetings are 20 minutes long and are held at lunch (also optional).
        The competition time usually takes 3 hours and the time is flexible.
      </p>
    </section>
  </div>
  
  <style lang="scss">
    .description {
      text-align: left;
      width: 100%;
    }
  
    .logo-section {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 2em;
    }
  
    .bigLogo {
      font-size: 5em;  /* increased from 4em */
      font-weight: bold;
      color: #f44336;
      margin: 0.1em;
    }
  
    .smallLogo {
      font-size: 1em;  /* increased from 0.8em */
      color: #ff5722;
      align-self: flex-end;
      margin: 0.1em;
    }
  
    .description section {
      margin-top: 3em;
    }
  
    .description h1 {
      font-size: 2.5em;  /* increased from 2em */
      color: #f44336;
      border-bottom: 2px solid #f44336;
      padding-bottom: 0.5em;
    }
  
    .description p {
      font-size: 1.2em;  /* increased from 1em */
      color: #333;
      text-align: justify;
    }
  </style>
  