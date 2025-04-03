import * as fs from 'node:fs';
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const greetingsFilePath = 'greetings.txt';

async function readGreetingsFile(filePath: string) {
    const message = await fs.promises.readFile(filePath, 'utf-8')
        .catch(() => '');
    return message;

}

const getGreeting = createServerFn({
    method: 'GET',
}).handler(() => {
    return readGreetingsFile(greetingsFilePath);
})

export const Route = createFileRoute('/')({
    component: Home,
    loader: async () => await getGreeting(),
});

function Home() {
    const router = useRouter();
    const state = Route.useLoaderData();

    return (
        <main>
            <h1>{state}</h1>
        </main>
    )
}