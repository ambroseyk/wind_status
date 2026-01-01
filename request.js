<script>
  fetch("https://api.weather.gov/stations/XCDC1/observations/latest")
    .then(r => r.json())
    .then(data => console.log(data));
</script>
