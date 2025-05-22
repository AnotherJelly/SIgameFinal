import React, { useState, useEffect, useMemo, useCallback } from "react";

const settingsApp = {
    timer: 60,
    roundIntroPause: 3000, // 3 sec
    answerTime: 15
};

const Button = React.memo(function Button({ value, question, onClick, isButtonBlinking }) {
    return (
        <div className="button-block">
            <button
                className={`button-table ${isButtonBlinking ? "blinking-button" : ""}`}
                onClick={() => onClick(value, question)}
            >
                {value}
            </button>
        </div>
    );
});

const Category = React.memo(function Category({ name, questions, onClick, answeredQuestions, questionText, roundIndex }) {
    return (
        <>
            <div className="category-title">{name}</div>
            {questions.map((question, index) => {
                if (answeredQuestions.includes(question.id)) {
                    return <div key={question.id} className="button-block"></div>;
                }
                return (
                    <Button
                        key={question.id}
                        value={100 * (roundIndex + 1) * (index + 1)}
                        question={question}
                        onClick={onClick}
                        isButtonBlinking={questionText === question}
                    />
                );
            })}
        </>
    );
});

const Player = React.memo(function Player({ 
    player, onAwardPoints, onDeductPoints, isQuestionSelected, setIsTimerPaused, 
    answerTime, specialQuestionType, handleSpecialLabelStart, bets, onBetChange, isEveryoneNull
}) {
    const [isCanAnswer, setIsCanAnswer] = useState(false);

    useEffect(() => {
        setIsCanAnswer(false);
    }, [isQuestionSelected]);

    const canBet = specialQuestionType === "bet" && (isEveryoneNull || player.points > 0);

    const handleCanAnswer = () => {
        if (specialQuestionType === "cat" || specialQuestionType === "bet") {
            handleSpecialLabelStart(player.id);
        }
        setIsTimerPaused(true);
        setIsCanAnswer(true);
    };
    
    return (
        <div className="player">
            {specialQuestionType === 'bet' && player.points > 0 && (
                <input
                    type="number"
                    min={0}
                    max={player.points}
                    value={bets[player.id] || ''}
                    onChange={(e) => onBetChange(player.id, Number(e.target.value))}
                />
            )}
            {isQuestionSelected && !(player.hasAnswered) && isCanAnswer && (
                <>
                    <div className="player-timer">
                        <div className="player-timer__line" style={{
                            animation: `slide-out ${answerTime}s linear forwards`
                        }}></div>
                    </div>
                    <div className="block-icons">
    
                        <button className="button-icons" onClick={() => onAwardPoints(player.id)}>
                            <i className="fas fa-check"></i>
                        </button>
                        
                        <button className="button-icons" onClick={() => onDeductPoints(player.id)}>
                            <i className="fas fa-times"></i>
                        </button>
    
                    </div>
                </>
            )}
            {/*((isShowAnswer && player.hasAnswered) || (isCanAnswer && isQuestionSelected)) && (
                <textarea disabled={player.hasAnswered || isShowAnswer}></textarea>
            )*/}
            {isQuestionSelected && !isCanAnswer && !player.hasAnswered && (canBet || specialQuestionType !== "bet") && (
                <button className="button-answer" onClick={handleCanAnswer}>Ответить</button>
            )}
            <div className="player-block">{player.name}</div>
            <div className="player-block player-block__score">{player.points}</div>
        </div>
    );
},
    function areEqual(prev, next) {
        if (prev.player !== next.player) {
            return false;
        }
        if (prev.player.points !== next.player.points) {
            return false;
        }
        if (prev.isQuestionSelected !== next.isQuestionSelected || prev.isShowAnswer !== next.isShowAnswer) {
            return false;
        }
        if ((prev.bets[prev.player.id] || 0) !== (next.bets[next.player.id] || 0)) {
            return false;
        }
        if (prev.specialQuestionType !== next.specialQuestionType) {
            return false;
        }

        return true;
});

function Timer({timer, isTimerPaused}) {
    const [time, setTime] = useState(timer);

    useEffect(() => {
        if (time > 0 && !isTimerPaused) {
            const timer = setInterval(() => {
                setTime(prevTime => prevTime - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [time, isTimerPaused]);

    return <div className="timer">{time}</div>;
}

function useRoundIntro(activeRoundIndex, pause) {
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        setShowIntro(true);
        const t = setTimeout(() => setShowIntro(false), pause);
        return () => clearTimeout(t);
    }, [activeRoundIndex, pause]);

    return showIntro;
}

export default function CategoryGrid({ playersData, rounds, onAwardPoints, onDeductPoints, resetAnswers }) {
  
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [isButtonBlinking, setIsButtonBlinking] = useState(null);
    const [isQuestionSelected, setIsQuestionSelected] = useState(null);

    const [isShowAnswer, setIsShowAnswer] = useState(false);
    const [isShowTimer, setIsShowTimer] = useState(true);
    const [isDisabledCloseBtn, setIsDisabledCloseBtn] = useState(false);

    const [activeRoundIndex, setActiveRoundIndex] = useState(0);
    const [roundIntroText, setRoundIntroText] = useState('Раунд 1');
    const showRoundIntro = useRoundIntro(activeRoundIndex, settingsApp.roundIntroPause);

    const [isTimerPaused, setIsTimerPaused] = useState(false);

    const [specialLabel, setSpecialLabel] = useState(null);

    const [bets, setBets] = useState({});
    const isEveryoneNull = useMemo(
        () => playersData.every(p => p.points <= 0),
        [playersData]
    );
    const handleBetChange = useCallback((playerId, betValue) => {
        setBets(prev => {
            const max = playersData.find(p => p.id === playerId).points;
            if (betValue > max) return prev;
            return { ...prev, [playerId]: betValue };
        });
    }, [playersData, setBets]);


    const nextRound = useCallback(() => {
        setRoundIntroText(`Раунд ${activeRoundIndex + 2}`);
        setActiveRoundIndex(idx => idx + 1);
    }, [activeRoundIndex, setRoundIntroText, setActiveRoundIndex]);

    const currentRoundQuestions = useMemo(
        () => rounds[activeRoundIndex]?.categories.flatMap(cat => cat.questions) || [],
        [rounds, activeRoundIndex]
    );

    useEffect(() => {
        const allAnswered = currentRoundQuestions.every(q => answeredQuestions.includes(q.id));
    
        if (allAnswered && activeRoundIndex < rounds.length - 1) {
            nextRound();
        } else if (allAnswered && activeRoundIndex == rounds.length - 1) {
            setRoundIntroText(`Конец игры`);
        }
    }, [currentRoundQuestions, answeredQuestions, activeRoundIndex, rounds, nextRound, setRoundIntroText]);

    const handleAward = useCallback((playerId) => {
        if (!selectedQuestion) return;

        let value = selectedQuestion.value;
        if (selectedQuestion.question.questionType === 'bet') {
            const betValues = Object.values(bets);
            const maxBet = betValues.length > 0 ? Math.max(...betValues) : 0;
            value = maxBet > 0 ? maxBet : selectedQuestion.value;
            setBets({});
        }

        onAwardPoints(playerId, value);

        handleShowAnswer();
        setIsDisabledCloseBtn(true);
        setIsTimerPaused(false);
        setTimeout(() => {
            setIsDisabledCloseBtn(false);
            setIsShowAnswer(false);
            setAnsweredQuestions(prev => [...prev, selectedQuestion.question.id]);
            setSelectedQuestion(null);
        }, 5000);
    }, [selectedQuestion, bets, onAwardPoints, setBets]);

    const handleDeduct = useCallback((playerId) => {
        if (!selectedQuestion) return;

        const questionTypeBet = selectedQuestion.question.questionType === 'bet';
        const questionTypeCat = selectedQuestion.question.questionType === 'cat';

        let value = selectedQuestion.value;
        if (questionTypeBet) {
            const betValues = Object.values(bets);
            const maxBet = betValues.length > 0 ? Math.max(...betValues) : 0;
            value = maxBet > 0 ? maxBet : selectedQuestion.value;
            setBets({});
        }

        onDeductPoints(playerId, value);
        setIsTimerPaused(false);
        if (questionTypeBet || questionTypeCat) {
            handleShowAnswer();
            setIsDisabledCloseBtn(true);

            setTimeout(() => {
                setIsDisabledCloseBtn(false);
                setIsShowAnswer(false);
                setAnsweredQuestions(prev => [...prev, selectedQuestion.question.id]);
                setSelectedQuestion(null);
                resetAnswers();
            }, 5000);
        }
     }, [selectedQuestion, bets, onDeductPoints, setBets]);

    const handleButtonClick = useCallback((value, question) => {
        setIsButtonBlinking(question);
        setTimeout(() => {
            setIsButtonBlinking(null);
            setIsQuestionSelected(true);
            if (!answeredQuestions.includes(question.id)) {
                if (['cat', 'bet'].includes(question.questionType)) {
                    const label = question.questionType === 'cat' ? 'Кот в мешке' : 'Вопрос со ставкой';
                    setSpecialLabel({ label, value, question });
                } else {
                    setSelectedQuestion({ value, question });
                    setIsShowTimer(true);
                }
            }
        }, 2000);
    }, [answeredQuestions, setIsButtonBlinking, setIsQuestionSelected, setSelectedQuestion, setIsShowTimer]);
  
    const handleAnswer = useCallback(() => {
        if (!selectedQuestion) return;
        setAnsweredQuestions(prev => [...prev, selectedQuestion.question.id]);
        setSelectedQuestion(null);
        resetAnswers();
        setIsShowAnswer(false);
        setIsTimerPaused(false);
    }, [selectedQuestion, resetAnswers, setIsShowAnswer, setIsTimerPaused]);

    const handleShowAnswer = useCallback(() => {
        setIsQuestionSelected(false);
        setIsShowAnswer(true);
    }, [setIsQuestionSelected, setIsShowAnswer]);

    const handleSpecialLabelStart = useCallback((playerId) => {
        if (specialLabel?.question.questionType === "cat" || specialLabel?.question.questionType === "bet" ) {
            setSelectedQuestion({ value: specialLabel.value, question: specialLabel.question });
            setSpecialLabel(null);
            setIsShowTimer(false);
            const updatedPlayers = playersData.map(player => ({
                ...player,
                hasAnswered: player.id !== playerId
            }));
            resetAnswers(updatedPlayers);
        }
    }, [specialLabel, setSelectedQuestion, setSpecialLabel, setIsShowTimer]);

    const renderRoundIntro = useCallback(text => (
        <div className="question"><p>{text}</p></div>
    ), []);

    const renderSpecialLabel = useCallback((label) => (
        <div className="question">
            <p className="special-label">{label.label}</p>
            <button
                className="button"
                onClick={() => {
                    setSelectedQuestion({ value: label.value, question: label.question });
                    setSpecialLabel(null);
                }}
            >
                Показать вопрос
            </button>
        </div>
    ), [isShowAnswer, isShowTimer, isDisabledCloseBtn, handleShowAnswer, handleAnswer]);

    const renderSelectedQuestion = useCallback(({ question }) => (
        <>
            {!isShowAnswer && isShowTimer && (
                <Timer timer={settingsApp.timer} isTimerPaused={isTimerPaused} />
            )}

            <div className="question">
            {!isShowAnswer ? (
                <>
                    <p>{question.text}</p>
                    <button className="button" onClick={handleShowAnswer}>
                        Показать ответ
                    </button>
                </>
            ) : (
                <>
                    <p className="answer-text">{question.answer}</p>
                    <button
                        className="button"
                        onClick={handleAnswer}
                        disabled={isDisabledCloseBtn}
                    >
                        Закрыть вопрос
                    </button>
                </>
            )}
            </div>
        </>
    ), [isShowAnswer, isShowTimer, isDisabledCloseBtn, handleShowAnswer, handleAnswer]);

    const categories = useMemo(
        () => rounds[activeRoundIndex]?.categories || [],
        [rounds, activeRoundIndex]
    );

    const renderCategories = useCallback(() => (
        categories.map((category) => (
            <Category
                key={category.id}
                name={category.name}
                questions={category.questions}
                onClick={handleButtonClick}
                answeredQuestions={answeredQuestions}
                questionText={isButtonBlinking}
                roundIndex={activeRoundIndex}
            />
        ))
    ), [categories, handleButtonClick, answeredQuestions, isButtonBlinking, activeRoundIndex]);
  
    let mainArea;
    if (showRoundIntro) mainArea = renderRoundIntro(roundIntroText);
    else if (specialLabel) mainArea = renderSpecialLabel(specialLabel);
    else if (selectedQuestion) mainArea = renderSelectedQuestion(selectedQuestion);
    else mainArea = renderCategories();

    return (
        <div className="category-grid">
            <div className="desk-grid">{mainArea}</div>

            <div className="players">
                {playersData.map((player) => (
                    <Player
                        key={player.id}
                        player={player}
                        onAwardPoints={handleAward}
                        onDeductPoints={handleDeduct}
                        isQuestionSelected={isQuestionSelected}
                        isShowAnswer={isShowAnswer}
                        setIsTimerPaused={setIsTimerPaused}
                        answerTime={settingsApp.answerTime}
                        specialQuestionType={specialLabel?.question.questionType}
                        handleSpecialLabelStart={handleSpecialLabelStart}
                        bets={bets}
                        onBetChange={handleBetChange}
                        isEveryoneNull={isEveryoneNull}
                    />
                ))}
            </div>
        </div>
    );
}