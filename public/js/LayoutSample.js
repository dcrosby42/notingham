export default {
    template: `
  <div class="columns">


<div class="column is-one-fifth">

  <aside class="menu">
    <p class="menu-label">
      General
    </p>
    <ul class="menu-list">
      <li><a>Dashboard</a></li>
      <li><a>Customers</a></li>
    </ul>
    <p class="menu-label">
      Administration
    </p>
    <ul class="menu-list">
      <li><a>Team Settings</a></li>
      <li>
        <a class="is-active">Manage Your Team</a>
        <ul>
          <li><a>Members</a></li>
          <li><a>Plugins</a></li>
          <li><a>Add a member</a></li>
        </ul>
      </li>
      <li><a>Invitations</a></li>
      <li><a>Cloud Storage Environment Settings</a></li>
      <li><a>Authentication</a></li>
    </ul>
    <p class="menu-label">
      Transactions
    </p>
    <ul class="menu-list">
      <li><a>Payments</a></li>
      <li><a>Transfers</a></li>
      <li><a>Balance</a></li>
    </ul>
  </aside>

</div>

<div class="column">

  <div class="block">
    This text is within a <strong>block</strong>.
  </div>
  <div class="block">
    This text is within a <strong>second block</strong>. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    Aenean efficitur sit amet massa fringilla egestas. Nullam condimentum luctus turpis.
  </div>
  <div class="block">
    This text is within a <strong>third block</strong>. This block has no margin at the bottom.
  </div>
</div>
  `,
}