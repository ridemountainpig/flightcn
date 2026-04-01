# flightcn

![flightcn](public/flightcn-og.png)

`flightcn` is a flight route visualization component set built for the `mapcn` ecosystem.
It helps you render airport markers, great-circle flight paths, and multi-leg routes on top of MapLibre-powered maps with a built-in airport dataset.

## Highlights

- Built to work with `mapcn`
- Render airports and routes directly from IATA codes like `TPE`, `HND`, and `LAX`
- Great-circle arc rendering with antimeridian handling
- Support for single routes, multiple routes, and multi-leg journeys
- Optional airport labels, hover states, and route animation
- Built-in airport registry with `code`, `name`, `city`, `country`, `latitude`, and `longitude`

## Install

Add `flightcn` from the shadcn registry:

```bash
npx shadcn@latest add @flightcn/flight
```

The registry item depends on `mapcn`, so the required `map` component will also be pulled in through the registry dependency chain.

Installed files:

- `components/ui/flight.tsx`
- `components/ui/flight-airports.ts`
- `components/ui/flight-airports-utils.ts`

## Quick Start

Import `Map` from `mapcn` and `FlightRoute` from `flightcn`, then render a route with airport markers:

```tsx
import { Map } from "@/components/ui/map";
import { FlightRoute } from "@/components/ui/flight";

export default function Demo() {
  return (
    <div className="h-screen w-screen">
      <Map className="h-full w-full" center={[121.5, 25]} zoom={3}>
        <FlightRoute from="TPE" to="LAX" showAirports showLabel />
      </Map>
    </div>
  );
}
```

## Components

### `FlightAirport`

Render a single airport marker from an IATA code or custom coordinates.

### `FlightRoute`

Render one route between two airports. Use this for the common point-to-point case.

### `FlightRoutes`

Render multiple independent routes in one map. Use this when each route should remain separate.

### `FlightMultiRoute`

Render a single journey across multiple waypoints. Use this when one trip should connect several legs in sequence.

## Airport Data

The built-in dataset is sourced from [OurAirports](https://ourairports.com/data/) and bundled locally in this project.

Current `AirportInfo` fields:

- `code`
- `name`
- `city`
- `country`
- `latitude`
- `longitude`

## Docs

- Main docs: [flightcn.yencheng.dev/docs](https://flightcn.yencheng.dev/docs)
- Install guide: [flightcn.yencheng.dev/docs/install](https://flightcn.yencheng.dev/docs/install)
- Registry homepage: [flightcn.yencheng.dev](https://flightcn.yencheng.dev)

## Local Development

For local development:

```bash
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm lint
pnpm build
pnpm registry:build
pnpm format
```
