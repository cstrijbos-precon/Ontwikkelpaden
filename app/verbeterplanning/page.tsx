import { redirect } from "next/navigation";

/**
 * Verbeterplanning draait als losse app, met een eigen inlog en een eigen
 * database. De code en een kopie van de gegevens staan hier nog wel, maar die
 * kopie loopt achter zodra er in de losse app iets wijzigt. Om te voorkomen
 * dat iemand via een oude link op verouderde cijfers uitkomt, sturen we door
 * naar de plek waar het echt wordt bijgehouden.
 *
 * Wil je Verbeterplanning ooit weer binnen deze app halen, haal dan deze
 * doorverwijzing weg — `VerbeterplanningApp` staat er nog.
 */
export default function VerbeterplanningPage() {
  redirect("https://verbeterplanning.vercel.app");
}
