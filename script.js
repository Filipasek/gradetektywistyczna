// Funkcja do obsługi interakcji z postaciami
const interactionsHistory = {}; // Historia interakcji dla każdej postaci

function interact(character, dialogue) {
    const dialogueBox = document.getElementById('dialogueBox');

    // Inicjalizacja historii postaci, jeśli nie istnieje
    if (!interactionsHistory[character]) {
        interactionsHistory[character] = [];
    }

    // Dodanie nowego dialogu do historii
    interactionsHistory[character].push(dialogue);

    // Wyczyszczenie wcześniejszych wiadomości
    dialogueBox.innerHTML = '';

    // Dodanie tytułu postaci
    const characterTitle = document.createElement('h3');
    characterTitle.textContent = `Historia interakcji z: ${character}`;
    dialogueBox.appendChild(characterTitle);

    // Wyświetlenie całej historii interakcji
    interactionsHistory[character].forEach((interaction) => {
        const dialogueText = document.createElement('p');
        dialogueText.textContent = interaction;
        dialogueBox.appendChild(dialogueText);
    });
}

// Funkcja do obsługi wysyłania wiadomości do narratora
function sendMessage() {
    const input = document.getElementById('playerInput').value.trim();

    if (input !== "") {
        const dialogueBox = document.getElementById('dialogueBox');

        // Dodanie wiadomości gracza do dialogu
        const playerMessage = document.createElement('p');
        playerMessage.textContent = `Ty: "${input}"`;
        playerMessage.style.color = '#7f8c8d';
        dialogueBox.appendChild(playerMessage);

        // Wyczyszczenie pola tekstowego
        document.getElementById('playerInput').value = '';

        // Symulowana odpowiedź narratora
        setTimeout(() => {
            const narratorResponse = document.createElement('p');
            narratorResponse.textContent = "Narrator: 'To może być ważna wskazówka!'";
            narratorResponse.style.color = '#f5a623';
            dialogueBox.appendChild(narratorResponse);
        }, 1000);
    }
}

// Funkcja do obsługi klawisza Enter w polu tekstowym
document.getElementById('playerInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});
