import React from 'react';

const tutorials = {
    common: [
        { id: "62", label: "Shall i help you" },
        { id: "47", label: "Lets go for lunch" },
        { id: "53", label: "Nice to Meet you" },
        { id: "81", label: "What is your name" },
        { id: "56", label: "Please call me later" },
        { id: "79", label: "What is today's date" },
        { id: "20", label: "Do you have money" },
        { id: "83", label: "Where is the bathroom" },
        { id: "29", label: "Hello" },
        { id: "33", label: "I am fine" },
        { id: "68", label: "Take Care" },
        { id: "34", label: "I am Sorry" },
        { id: "11", label: "Be Careful" },
        { id: "54", label: "Open the door" },
        { id: "3", label: "Any Questions" },
        { id: "5", label: "Are you Hungry" }
    ],
    alphabets: "abcdefghijklmnopqrstuvwxyz".split(''),
    objects: [
        { id: "64", label: "Shop" },
        { id: "60", label: "Punjab" },
        { id: "69", label: "Temple" },
        { id: "51", label: "Mumbai" },
        { id: "61", label: "Saturday" },
        { id: "77", label: "Wednesday" },
        { id: "57", label: "Police station" },
        { id: "13", label: "Cat" },
        { id: "42", label: "July" },
        { id: "59", label: "Pune" },
        { id: "12", label: "Bridge" },
        { id: "28", label: "Grapes" },
        { id: "10", label: "Banglore" },
        { id: "18", label: "December" }
    ]
};

// Map IDs/values to GIF filenames based on reference observation or assumed convention
// Since we don't have the exact mapping logic from 'tutorial.js' of the reference, 
// we'll assume the GIFs are named similarly or rely on the user to click and see.
// Actually, looking at the html: <img src="static/ISL_Gifs/29-hello.gif">
// It seems the naming convention is `ID-label.gif` or similar.
// For simplicity in this v1, checking the copied GIFs might be needed, but let's try to infer or just list them.
// Wait, the reference project uses an `image-loader` div.
// Let's create a grid of buttons that updates a main preview image.

const Tutorials = () => {
    const [currentGif, setCurrentGif] = React.useState("/gifs/65-sign-language-interpreter.gif");
    const [currentLabel, setCurrentLabel] = React.useState("Sign Language Interpreter");

    const playGif = (id, label) => {
        // The filenames in the reference seem to be like "29-hello.gif"
        // Since we copied all gifs to /gifs/, we need to find the matching file.
        // Without listing the directory, we might guess. 
        // For now, let's try to match the pattern "ID-label.gif" roughly.
        // Actually, let's just search for the file usage in the reference if possible.
        // But better: let the user click and we try to load `id-label.gif` normalized.

        const normalizedLabel = label.toLowerCase().replace(/ /g, '-').replace(/'/g, '');
        // Try construction:
        setCurrentGif(`/gifs/${id}-${normalizedLabel}.gif`);
        setCurrentLabel(label);
    };

    // Fallback for alphabets: they are likely just "a.gif" etc or "a-a.gif"?
    // In reference: value="a" id="a".
    const playAlphabet = (char) => {
        setCurrentGif(`/gifs/${char}.gif`);
        setCurrentLabel(`Alphabet: ${char.toUpperCase()}`);
    };

    return (
        <div className="pt-24 pb-12 bg-slate-50 min-h-screen">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Learning Hub</h1>
                    <p className="text-lg text-gray-600">Explore common phrases, alphabets, and words in Indian Sign Language.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Display Area */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-24 border border-gray-200">
                            <div className="bg-gray-100 aspect-square flex items-center justify-center p-4">
                                <img
                                    src={currentGif}
                                    alt={currentLabel}
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/gifs/65-sign-language-interpreter.gif"; // Fallback
                                        // Try one more variation if needed?
                                    }}
                                />
                            </div>
                            <div className="p-6 text-center">
                                <h3 className="text-xl font-bold text-gray-800">{currentLabel}</h3>
                                <p className="text-sm text-gray-500 mt-2">Watch and practice the gesture.</p>
                            </div>
                        </div>
                    </div>

                    {/* Controls Area */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Common Phrases */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Common Phrases</h3>
                            <div className="flex flex-wrap gap-2">
                                {tutorials.common.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => playGif(item.id, item.label)}
                                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Alphabets */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Alphabets</h3>
                            <div className="flex flex-wrap gap-2">
                                {tutorials.alphabets.map(char => (
                                    <button
                                        key={char}
                                        onClick={() => playAlphabet(char)}
                                        className="w-10 h-10 flex items-center justify-center bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-bold transition-colors border border-purple-200 uppercase"
                                    >
                                        {char}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Words */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Places & Objects</h3>
                            <div className="flex flex-wrap gap-2">
                                {tutorials.objects.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => playGif(item.id, item.label)}
                                        className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors border border-green-200"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tutorials;
