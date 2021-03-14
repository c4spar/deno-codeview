export const loadingTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Loading</title>
    <style>
      * {
        padding: 0;
        margin: 0;
        box-sizing: border-box;
      }

      body {
        padding: 30px;
        background-color: #191919;
        color: whitesmoke;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }

      .container {
        position: relative;
        text-align: center;
      }

      /* Headline */

      .headline {
        position: relative;
        font-weight: bold;
        margin-bottom: 45px;
      }

      .headline span {
        position: relative;
        display: inline-block;
        font-size: 40px;
        animation: wave 1s infinite;
        animation-delay: calc(.1s * var(--i))
      }

      @keyframes wave {
        0%, 40%, 100% {
          transform: translateY(0)
        }
        20% {
          transform: translateY(-20px)
        }
      }

      /* Subtitle */

      .subtitle {
        position: relative;
        color: lightgray;
        font-weight: bold;
      }

      /* Paws */

      #deno-sprite,
      #paw-sprite {
        position: absolute;
        display: none;
      }

      .loader {
        margin-top: 55px;
      }

      .loader .paws {
        display: flex;
      }

      .loader .paws .paw {
        -webkit-animation: 2050ms pawAnimation ease-in-out infinite;
        animation: 2050ms pawAnimation ease-in-out infinite;
        opacity: 0;
      }

      .loader .paws .paw .icon {
        width: 3em;
        height: 3em;
        /*color: green;*/
        color: #3f83f8;
        fill: currentColor;
        transform: rotate(90deg);
        transform-origin: 50% 50%;
        margin: 10px 30px;
      }

      .loader .paws:nth-child(1) .paw .icon {
        transform: rotate(80deg) translateY(-70%);
      }

      .loader .paws:nth-child(2) .paw .icon {
        transform: rotate(100deg) translateY(70%);
      }

      .loader .paws:nth-child(2) .paw:nth-child(1) {
        -webkit-animation-delay: 0s;
        animation-delay: 0s;
      }

      .loader .paws:nth-child(1) .paw:nth-child(1) {
        -webkit-animation-delay: 0.25s;
        animation-delay: 0.25s;
      }

      .loader .paws:nth-child(2) .paw:nth-child(2) {
        -webkit-animation-delay: 0.5s;
        animation-delay: 0.5s;
      }

      .loader .paws:nth-child(1) .paw:nth-child(2) {
        -webkit-animation-delay: 0.75s;
        animation-delay: 0.75s;
      }

      .loader .paws:nth-child(2) .paw:nth-child(3) {
        -webkit-animation-delay: 1s;
        animation-delay: 1s;
      }

      .loader .paws:nth-child(1) .paw:nth-child(3) {
        -webkit-animation-delay: 1.25s;
        animation-delay: 1.25s;
      }

      @-webkit-keyframes pawAnimation {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0;
        }
        100% {
          opacity: 0;
        }
      }

      @keyframes pawAnimation {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0;
        }
        100% {
          opacity: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="headline">
        <span style="--i:1">C</span>
        <span style="--i:2">o</span>
        <span style="--i:3">d</span>
        <span style="--i:4">e</span>
        <span style="--i:5">v</span>
        <span style="--i:6">i</span>
        <span style="--i:7">e</span>
        <span style="--i:8">w</span>
      </div>
      <small class="subtitle">{{subtitle}}</small>

      <div class="loader">
        <div class="paws">
          <div class="paw">
            <svg class="icon">
              <use xlink:href="#paw"/>
            </svg>
          </div>
          <div class="paw">
            <svg class="icon">
              <use xlink:href="#paw"/>
            </svg>
          </div>
          <div class="paw">
            <svg class="icon">
              <use xlink:href="#paw"/>
            </svg>
          </div>
        </div>
        <div class="paws">
          <div class="paw">
            <svg class="icon">
              <use xlink:href="#paw"/>
            </svg>
          </div>
          <div class="paw">
            <svg class="icon">
              <use xlink:href="#paw"/>
            </svg>
          </div>
          <div class="paw">
            <svg class="icon">
              <use xlink:href="#paw"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <svg
      id="paw-sprite"
      width="263.000000pt"
      height="262.000000pt"
      viewBox="0 0 263.000000 262.000000"
      preserveAspectRatio="xMidYMid meet"
    >
      <symbol id="paw" viewBox="0 0 263 262">
        <g
          transform="translate(0.000000,262.000000) scale(0.100000,-0.100000)"
          stroke-width="0"
        >
          <path d="M1288 2558 c-19 -35 -54 -98 -77 -140 -34 -63 -44 -92 -50 -150 -5
-54 -14 -83 -33 -111 -37 -52 -43 -122 -28 -289 13 -136 10 -307 -9 -613 -5
-84 -9 -103 -15 -80 -44 161 -53 180 -123 257 -43 48 -66 85 -87 139 -65 169
-112 229 -180 229 -16 0 -42 11 -60 28 -18 15 -53 41 -79 59 -57 39 -97 98
-104 153 -7 51 -20 48 -55 -17 -78 -143 -71 -308 18 -411 30 -35 34 -47 34
-95 0 -73 11 -99 69 -166 26 -31 59 -76 74 -101 43 -76 185 -516 218 -676 82
-403 177 -531 419 -566 103 -15 205 -2 292 39 155 74 235 215 307 546 33 150
168 570 211 657 16 30 49 84 75 119 59 80 84 135 85 182 0 24 7 42 21 55 31
28 56 82 70 151 16 79 2 163 -43 253 -37 72 -58 88 -58 43 -1 -45 -34 -107
-76 -141 -72 -58 -134 -102 -145 -102 -37 0 -69 -35 -117 -127 -29 -54 -83
-134 -120 -178 -37 -44 -77 -96 -89 -115 -23 -39 -73 -190 -73 -222 0 -12 -3
-19 -6 -15 -10 10 -29 332 -28 492 0 83 4 211 8 287 l9 136 -30 59 c-26 51
-30 66 -25 120 3 41 -1 76 -12 110 -21 61 -127 255 -143 260 -6 2 -27 -24 -45
-59z"/>
        </g>
      </symbol>
    </svg>

    <script type="application/javascript">
      window.updateLoadingMessage = function(message) {
        document.querySelector(".subtitle").textContent = message;
      };
    </script>
  </body>
</html>

`;
