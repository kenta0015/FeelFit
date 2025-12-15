// app/player.tsx
// Legacy route: keep /player working by redirecting to new HUD at /(tabs)/player.

import React from "react";
import { Redirect } from "expo-router";

export default function PlayerLegacyRedirect() {
  return <Redirect href="/(tabs)/player" />;
}
