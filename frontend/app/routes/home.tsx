import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Simba Academy Preschool | Where Little Cubs Learn to Roar" },
    { name: "description", content: "Welcome to Simba Academy Preschool, the ultimate jungle safari for early childhood education, creative play, and early learning." },
  ];
}

export default function Home() {
  return <Welcome />;
}
