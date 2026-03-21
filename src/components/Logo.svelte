<script lang="ts">
</script>

<div
  class="relative flex items-center justify-center mx-auto -my-12 w-max -z-10"
>
  <svg width="0" height="0" class="absolute pointer-events-none">
    <filter id="svg-outline">
      <feMorphology
        in="SourceAlpha"
        result="expanded"
        operator="dilate"
        radius="5"
      />
      <feFlood flood-color="white" />
      <feComposite in2="expanded" operator="in" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </svg>
  <img
    src="/logo.svg"
    alt="20-Question Game Logo"
    class="w-80 h-80"
    style="filter: url(#svg-outline) drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.3));"
  />
</div>
