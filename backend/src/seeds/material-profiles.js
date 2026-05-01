function now() {
  return new Date().toISOString();
}

module.exports = [
  {
    id: "mat_123",
    name: "Wood - Light Burn",
    category: "wood",
    recommended_speed: 1000,
    recommended_power: 65,
    recommended_passes: 1,
    notes: "Good for shallow marking on soft wood. Adjust power up for darker burn.",
    created_at: now()
  },
  {
    id: "mat_124",
    name: "Wood - Deep Engrave",
    category: "wood",
    recommended_speed: 500,
    recommended_power: 85,
    recommended_passes: 2,
    notes: "For deep engraving on hardwood. Multiple passes recommended.",
    created_at: now()
  },
  {
    id: "mat_125",
    name: "Acrylic - Cutting",
    category: "acrylic",
    recommended_speed: 300,
    recommended_power: 90,
    recommended_passes: 3,
    notes: "Cut through 3mm acrylic. Ensure proper ventilation.",
    created_at: now()
  },
  {
    id: "mat_126",
    name: "Leather - Marking",
    category: "leather",
    recommended_speed: 1500,
    recommended_power: 40,
    recommended_passes: 1,
    notes: "Light marking on genuine leather. Test on scrap first.",
    created_at: now()
  }
];
