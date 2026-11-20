Activity 5 WST — Query Board Dashboard

The React app opens directly to the Query Board dashboard. It follows the supplied reference layout: no sidebar, four summary cards across the top, then 15 numbered visualizations in a scrollable three-column grid. The visual theme is sky blue and white.

The Laravel endpoint /api/v1/products/queries supplies chart data from the existing categories, products, users, orders, order_products, and reviews tables. The All Time / This Year / Last 30 Days filter applies to transactional metrics; catalogue product counts remain all-time. No fabricated chart series are used. Empty datasets display an empty-state message.

The existing orders migration has no order-status field, so chart 4 is Orders by Category rather than an invented order-status breakdown.

See RUN_GUIDE.txt for setup and run instructions.
