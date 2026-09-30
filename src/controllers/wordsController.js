import words from "../data/words.js";

export function getWords(request, response) {
    response.status(200).json({
        count: words.length,
        data: words,
    });
}

export function getWordById(request, response) {
    const id = Number(request.params.id);

    const word = words.find(
        (item) => item.id === id,
    );

    if (!word) {
        return response.status(404).json({
            message: "Word not found",
        });
    }

    response.status(200).json({
        data: word,
    });
}

export function createWord(request, response) {
    const {
        hebrew,
        translation,
        category,
    } = request.body;

    if (
        !hebrew ||
        !translation ||
        !category
    ) {
        return response.status(400).json({
            message: "Missing required fields",
        });
    }

    const newId =
        words.length === 0
            ? 1
            : Math.max(
            ...words.map((word) => word.id),
        ) + 1;

    const newWord = {
        id: newId,
        hebrew,
        translation,
        category,
    };

    words.push(newWord);

    response.status(201).json({
        message: "Word created",
        data: newWord,
    });
}

export function updateWord(request, response) {
    const id = Number(request.params.id);

    const word = words.find(
        (item) => item.id === id,
    );

    if (!word) {
        return response.status(404).json({
            message: "Word not found",
        });
    }

    const {
        hebrew,
        translation,
        category,
    } = request.body;

    if (
        !hebrew ||
        !translation ||
        !category
    ) {
        return response.status(400).json({
            message: "Missing required fields",
        });
    }

    word.hebrew = hebrew;
    word.translation = translation;
    word.category = category;

    response.status(200).json({
        message: "Word updated",
        data: word,
    });
}

export function deleteWord(request, response) {
    const id = Number(request.params.id);

    const wordIndex = words.findIndex(
        (item) => item.id === id,
    );

    if (wordIndex === -1) {
        return response.status(404).json({
            message: "Word not found",
        });
    }

    const deletedWord = words.splice(
        wordIndex,
        1,
    )[0];

    response.status(200).json({
        message: "Word deleted",
        data: deletedWord,
    });
}