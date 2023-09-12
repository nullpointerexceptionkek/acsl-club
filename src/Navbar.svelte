<script>
    function scrollTo(elementId) {
      let element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  </script>
  
  <nav class="navbar">
    <ul>
      <li>
        <button on:click={() => scrollTo('discover-acsl')}>About us</button>
      </li>
    </ul>
  </nav>
  
  <style>
    .navbar {
      position: fixed;
      top: 0;
      width: 100%;
      padding: 10px 0;
      background-color: #FFFDFA;
      box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.2);
    }
  
    .navbar ul {
      list-style: none;
      display: flex;
      justify-content: space-around;
      padding: 0;
      margin: 0;
    }
  
    .navbar ul li {
      font-size: 1.2em;
    }
  
    .navbar button {
      background: none;
      border: none;
      cursor: pointer;
      transition: color 0.3s ease;
    }
  
    .navbar button:hover {
      color: #0fbdaf;
    }
  </style>
  
  