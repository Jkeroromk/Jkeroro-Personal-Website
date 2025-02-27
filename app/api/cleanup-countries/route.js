// import { cleanupDuplicateCountries } from "../../../firebase"; // Adjust path if firebase.js is elsewhere

// export async function POST(request) {
//   try {
//     await cleanupDuplicateCountries();
//     return new Response(JSON.stringify({ message: "Cleanup complete" }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (error) {
//     console.error("Cleanup failed:", error);
//     return new Response(JSON.stringify({ error: "Cleanup failed" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }