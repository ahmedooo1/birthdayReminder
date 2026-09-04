// Draws the red pen circle around "today" on the homepage hero calendar the
// first time it scrolls into view. Scoped to the logged-out hero only --
// does not touch anything in the authenticated app views.
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function reveal(el) {
    if (!el) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      el.classList.add('is-drawn');
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-drawn');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
  }

  document.addEventListener('DOMContentLoaded', function () {
    reveal(document.querySelector('.home-today-circle'));
    reveal(document.querySelector('.home-title-circle-svg'));
  });
})();
