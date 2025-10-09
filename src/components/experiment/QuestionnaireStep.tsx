import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'react-toastify';

type QuestionType = 'single' | 'multi' | 'text';

interface QuestionnaireStepProps {
  configId: Id<'experimentConfigs'>;
  userId: Id<'users'>;
  onCompleted: (submittedAt: number) => Promise<void> | void;
}

interface QuestionOption {
  value: string;
  label: string;
}

interface Question {
  _id: Id<'questionnaires'>;
  question: string;
  type: QuestionType;
  order: number;
  options?: QuestionOption[];
  required: boolean;
}

export default function QuestionnaireStep({ configId, userId, onCompleted }: QuestionnaireStepProps) {
  const { questions } =
    useQuery(api.experiment.questionnaire.getQuestionnaire, {
      configId,
      onlyActive: true,
    }) ?? {};
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  const saveResponses = useMutation(api.experiment.questionnaire.saveQuestionnaireResponses);

  useEffect(() => {
    if (!questions) {
      return;
    }
    const initial: Record<string, any> = {};
    for (const q of questions) {
      if (q.type === 'multi') {
        initial[q._id] = [];
      } else {
        initial[q._id] = '';
      }
    }
    setAnswers(initial);
  }, [questions]);

  const orderedQuestions: Question[] = useMemo(() => {
    return (questions as Question[] | undefined)?.slice().sort((a, b) => a.order - b.order) ?? [];
  }, [questions]);

  const handleOptionToggle = (questionId: string, optionValue: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const hasValue = current.includes(optionValue);
      return {
        ...prev,
        [questionId]: hasValue
          ? current.filter((value: string) => value !== optionValue)
          : [...current, optionValue],
      };
    });
  };

  const validate = () => {
    for (const question of orderedQuestions) {
      if (!question.required) continue;
      const value = answers[question._id];
      if (question.type === 'multi') {
        if (!Array.isArray(value) || value.length === 0) {
          return `Please select at least one option for “${question.question}”.`;
        }
      } else if (!value || (typeof value === 'string' && value.trim().length === 0)) {
        return `Please provide an answer for “${question.question}”.`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const responses = orderedQuestions.map((question) => ({
        questionId: question._id,
        answer: answers[question._id],
      }));
      const result = await saveResponses({
        configId,
        userId,
        responses,
      });
      await onCompleted(result.submittedAt ?? Date.now());
    } catch (error: any) {
      toast.error(error.message ?? 'Failed to submit responses');
    } finally {
      setSubmitting(false);
    }
  };

  if (!orderedQuestions || orderedQuestions.length === 0) {
    return (
      <div className="max-w-2xl w-full mx-auto text-center text-brown-200">
        <p>Loading questionnaire…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {orderedQuestions.map((question) => (
          <div key={question._id} className="box bg-brown-800">
            <div className="bg-brown-700 p-3">
              <h3 className="text-xl font-display text-brown-100">
                {question.question}
                {question.required && <span className="text-brown-300 text-sm ml-2">(required)</span>}
              </h3>
            </div>
            <div className="p-4 space-y-3 text-brown-100">
              {question.type === 'text' && (
                <textarea
                  className="w-full px-3 py-2 border border-brown-600 rounded bg-brown-700 text-brown-100 focus:outline-none focus:border-brown-400"
                  rows={4}
                  value={answers[question._id] ?? ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question._id]: e.target.value,
                    }))
                  }
                  placeholder="Write your response here"
                />
              )}
              {question.type === 'single' && (
                <div className="space-y-2">
                  {question.options?.map((option) => (
                    <label key={option.value} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={question._id}
                        value={option.value}
                        checked={answers[question._id] === option.value}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question._id]: option.value,
                          }))
                        }
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {question.type === 'multi' && (
                <div className="space-y-2">
                  {question.options?.map((option) => (
                    <label key={option.value} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={Array.isArray(answers[question._id]) && answers[question._id].includes(option.value)}
                        onChange={() => handleOptionToggle(question._id, option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          className="w-full button text-white shadow-solid text-lg cursor-pointer pointer-events-auto"
        >
          <div className="h-full bg-clay-700 text-center py-3">
            <span>{submitting ? 'Submitting...' : 'Submit responses'}</span>
          </div>
        </button>
      </form>
    </div>
  );
}
