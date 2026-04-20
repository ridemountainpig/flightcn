# flightcn

![flightcn](public/flightcn-og.png)

`flightcn` is a visualization component set built for the `mapcn` ecosystem.
It helps you render airport markers, great-circle flight paths, multi-leg routes, and globe-based satellite orbit overlays on top of MapLibre-powered maps.

## Highlights

- Built to work with `mapcn`
- Render airports and routes directly from IATA codes like `TPE`, `HND`, and `LAX`
- Great-circle arc rendering with antimeridian handling
- Support for single routes, multiple routes, and multi-leg journeys
- Globe-based satellite orbit overlays with ground tracks and animated markers
- Custom satellite SVG marker support for orbital visualizations
- Optional airport labels, hover states, and route animation
- Built-in airport registry with `code`, `name`, `city`, `country`, `latitude`, and `longitude`

## Install

### Flight

Add the flight components from the shadcn registry:

```bash
npx shadcn@latest add @flightcn/flight
```

The registry item depends on `mapcn`, so the required `map` component will also be pulled in through the registry dependency chain.

Installed files:

- `components/ui/flight.tsx`
- `components/ui/flight-airports.ts`
- `components/ui/flight-airports-utils.ts`

### Satellite

Add the satellite overlay component from the shadcn registry:

```bash
npx shadcn@latest add @flightcn/satellite
```

Installed files:

- `components/ui/satellite-orbit.tsx`

## Quick Start

After installing from the shadcn registry, import the generated local `Map` and `FlightRoute` components, then render a route with airport markers:

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

### `SatelliteOrbit`

Render a single globe-based orbital path with an animated satellite marker, ground track, and optional custom SVG icon.

### `SatelliteOrbits`

Render multiple orbital overlays from one dataset while sharing animation, connector, and label behavior.

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

- Flight docs: [flightcn.yencheng.dev/docs/flight](https://flightcn.yencheng.dev/docs/flight)
- Satellite docs: [flightcn.yencheng.dev/docs/satellite](https://flightcn.yencheng.dev/docs/satellite)
- Flight install guide: [flightcn.yencheng.dev/docs/install/flight](https://flightcn.yencheng.dev/docs/install/flight)
- Satellite install guide: [flightcn.yencheng.dev/docs/install/satellite](https://flightcn.yencheng.dev/docs/install/satellite)
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
