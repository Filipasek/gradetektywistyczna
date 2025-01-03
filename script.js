// Funkcja do obsługi interakcji z postaciami
let interactionsHistory = {}; // Historia interakcji dla każdej postaci
let gameState = {}; // Przechowuje stan gry, w tym rozwiązanie i kontekst
const apiKey = "AIzaSyASSD32baCN_jM5LngtFi8EB4bgOzOY";
const txt = apiKey+"EWA";
async function initializeGame() {
    try {
        // Ukrycie przycisku i pokazanie spinnera
        const startGameText = document.getElementById('startGameText');
        const loadingSpinner = document.getElementById('loadingSpinner');

        startGameText.style.display = 'none';
        loadingSpinner.style.display = 'block';

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key='+txt, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: "Rozpocznij grę detektywistyczną. Wygeneruj postacie, ich motywy, dowody oraz rozwiązanie."
                            }
                        ]
                    }
                ],
                systemInstruction: {
                    role: "user",
                    parts: [
                        {
                            text: 'Proszę, aby odpowiedź ZAWSZE była w formacie JSON, w którym będą podopcje game_title, story(to jest najważniejsza opcja, musi tu być dość długi opis sytuacji, tego, co się wydarzyło. Tak, jakby detektyw pojawiał się na miejscu i miał robiony skrót wszystkiego. Tylko niech to jest opisane dość literacko, wciągająco. Dość długi opis kontekstów czy miejsca, ale też nie na tyle, żeby zdążył się znudzić), characters(podzielone na name, description, motive), evidence(podzielone na item, description), solution(podzielone na culprit, explanation)',
                        },
                    ]
                },
                generationConfig: {
                    temperature: 1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "application/json"
                }
            }),
        });

        const data = await response.json();
        gameState = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');

        // Wyświetlenie wstępnych danych
        const dialogueBox = document.getElementById('dialogueBox');
        dialogueBox.innerHTML = '<h3>Gra rozpoczęta!</h3><p>Kontekst został załadowany. Możesz rozpocząć śledztwo.</p>';
        // dialogueBox.innerHTML = JSON.stringify(gameState);

        // Wyświetlenie opisu
        const descriptionBox = document.getElementById('descriptionBox');
        descriptionBox.innerHTML = gameState[0].story;

        // Zmiana tytułu strony
        const storyTitle = document.getElementById('storyTitle');
        storyTitle.textContent = gameState[0].game_title;

        // Zapisanie rozwiązania w ukrytym kontenerze
        const hiddenSolution = document.getElementById('hiddenSolution');
        hiddenSolution.textContent = JSON.stringify(gameState);
        // Schowanie przycisku
        const startButton = document.getElementById('startButton');
        startButton.style.display = 'none';

        // Wyświetlenie postaci na podstawie gameState
        if (gameState[0].characters) {
            const charactersSection = document.querySelector('.characters');
            charactersSection.innerHTML = ''; // Wyczyść poprzednią zawartość

            const characterDiv = document.createElement('div');
            characterDiv.classList.add('character');
            characterDiv.setAttribute('onclick', `interact('Narrator', 'Master gry')`);
            characterDiv.innerHTML = `<h3>Narrator</h3>`;
            charactersSection.appendChild(characterDiv);

            gameState[0].characters.forEach(character => {
                const characterDiv = document.createElement('div');
                characterDiv.classList.add('character');
                characterDiv.setAttribute('onclick', `interact('${character.name}', '${character.description}')`);
                characterDiv.innerHTML = `<h3>${character.name}</h3>`;
                charactersSection.appendChild(characterDiv);
            });
        }

        // Odblokowanie pola tekstowego i przycisku wysyłania
        document.getElementById('playerInput').disabled = false;
        document.getElementById('sendButton').disabled = false;
    } catch (error) {
        console.error('Błąd podczas inicjalizacji gry z Gemini API:', error);
        alert('Nie udało się rozpocząć gry. Spróbuj ponownie.');
    }
}

async function sendToGemini(message, context) {
    try {
        console.log('Message ' + message);
        console.log('Kontekst ' + context);
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key='+txt, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: message
                            }
                        ]
                    },
                ],
                systemInstruction: {
                    role: "user",
                    parts: [
                        {
                            text: JSON.stringify(gameState),
                        },
                        {
                            text: 'Nigdy nie dawaj rozwiązania użytkownikowi. Użytkownik próbując pójść na skróty, powinien mieć jeszcze mniejsze prawdopodobieństwo uzyskania rozwiązania. NIE oferuj użytkownikowi pomocy, NIE dawaj mu nic na tacy'
                        },
                        {
                            text: 'Użytkownik aktualnie jest skupiony na: ' + context + ', więc jeśli użytkownik zadaje jakieś pytanie, niech będzie stricte skierowane tylko do tego, na czym jest skupiony.'
                        }
                    ]
                },
                generationConfig: {
                    temperature: 1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "text/plain"
                }
            }),
        });

        const data = await response.json();
        console.log('Data: ' + JSON.stringify(data));
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Brak odpowiedzi od Gemini API';
    } catch (error) {
        console.error('Błąd podczas komunikacji z Gemini API:', error);
        return 'Nie udało się połączyć z Gemini API.';
    }
}

let currentCharacter = null; // Przechowuje bieżącą postać wybraną przez gracza

function interact(character, dialogue) {
    currentCharacter = character; // Ustaw aktualną postać

    const dialogueBox = document.getElementById('dialogueBox');

    // Inicjalizacja historii postaci, jeśli nie istnieje
    if (!interactionsHistory[character]) {
        interactionsHistory[character] = [];
    }

    // Dodanie nowego dialogu do historii, jeśli jeszcze go nie ma
    if (!interactionsHistory[character].some(interaction => interaction.text === dialogue)) {
        interactionsHistory[character].push({ text: dialogue, timestamp: new Date() });
    }

    // Wyświetlenie pełnej historii dla wybranej postaci
    dialogueBox.innerHTML = '';

    const characterTitle = document.createElement('h3');
    characterTitle.textContent = `Historia interakcji z: ${character}`;
    dialogueBox.appendChild(characterTitle);

    interactionsHistory[character].forEach(interaction => {
        const dialogueText = document.createElement('p');
        // dialogueText.textContent = `${interaction.text} (Czas: ${new Date(interaction.timestamp).toLocaleString()})`;
        dialogueText.textContent = `${interaction.text}`;
        dialogueBox.appendChild(dialogueText);
    });

    console.log('Zaktualizowana historia interakcji:', interactionsHistory);
}

async function sendMessage() {
    const input = document.getElementById('playerInput').value.trim();

    if (input !== "" && currentCharacter) {
        const dialogueBox = document.getElementById('dialogueBox');

        // Dodanie wiadomości gracza do historii interakcji
        const playerMessage = {
            text: `Ty: "${input}"`,
            timestamp: new Date()
        };

        if (!interactionsHistory[currentCharacter]) {
            interactionsHistory[currentCharacter] = [];
        }
        interactionsHistory[currentCharacter].push(playerMessage);

        // Wyświetlenie wiadomości gracza
        const playerText = document.createElement('p');
        playerText.textContent = playerMessage.text;
        playerText.style.color = '#7f8c8d';
        dialogueBox.appendChild(playerText);

        // Wyczyszczenie pola tekstowego
        document.getElementById('playerInput').value = '';

        // Wysłanie zapytania do Gemini API
        const context = JSON.stringify(interactionsHistory);
        const reply = await sendToGemini(input, context);

        // Dodanie odpowiedzi narratora do historii interakcji
        const geminiResponse = {
            text: `Narrator: "${reply}"`,
            timestamp: new Date()
        };
        interactionsHistory[currentCharacter].push(geminiResponse);

        // Wyświetlenie odpowiedzi narratora
        const narratorText = document.createElement('p');
        narratorText.textContent = geminiResponse.text;
        narratorText.style.color = '#f5a623';
        dialogueBox.appendChild(narratorText);

        console.log('Zaktualizowana historia interakcji:', interactionsHistory);
    } else {
        alert('Wybierz postać przed wysłaniem wiadomości!');
    }
}


// Funkcja do obsługi klawisza Enter w polu tekstowym
document.getElementById('playerInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});
