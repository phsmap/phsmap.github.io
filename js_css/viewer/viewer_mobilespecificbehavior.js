function startUpMobileListeners() {
    const zoomableDiv = document.getElementById('zoomableDiv');
    let scale = 1;
    let lastTouchX;
    let lastTouchY;

    zoomableDiv.addEventListener('touchstart', function(event) {
      if (event.touches.length === 2) {
        event.preventDefault();
        // If two fingers touch the screen, calculate the initial distance between them
        initialTouchDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        );
      } else if (event.touches.length === 1) {
        event.preventDefault();
        // If one finger touches the screen, record its position for dragging
        lastTouchX = event.touches[0].clientX;
        lastTouchY = event.touches[0].clientY;
      }
    });

    zoomableDiv.addEventListener('touchmove', function(event) {
      if (event.touches.length === 2) {
        // Calculate the current distance between the two fingers
        const currentTouchDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        );

        // Calculate the scale factor based on the change in distance
        const scaleFactor = currentTouchDistance / initialTouchDistance;

        // Apply the scale transformation to the content inside the div
        scale *= scaleFactor;
        this.querySelector('canvas').style.transform = `scale(${scale})`;

        // Update the initial touch distance for the next move event
        initialTouchDistance = currentTouchDistance;
      } else if (event.touches.length === 1) {
        // If one finger is used, calculate the movement distance
        const deltaX = event.touches[0].clientX - lastTouchX;
        const deltaY = event.touches[0].clientY - lastTouchY;

        // Move the content inside the div by the calculated distance
        this.querySelector('canvas').style.left = `${parseFloat(this.querySelector('canvas').style.left || 0) + deltaX}px`;
        this.querySelector('canvas').style.top = `${parseFloat(this.querySelector('canvas').style.top || 0) + deltaY}px`;

        // Update the last touch position for the next move event
        lastTouchX = event.touches[0].clientX;
        lastTouchY = event.touches[0].clientY;
      }
    });
  }


window.addEventListener("load", startUpMobileListeners);
