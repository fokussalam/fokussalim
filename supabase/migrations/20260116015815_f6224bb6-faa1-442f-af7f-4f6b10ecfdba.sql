-- Create scheduled_quizzes table
CREATE TABLE public.scheduled_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT false,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.scheduled_quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.scheduled_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(quiz_id, user_id)
);

-- Create quiz_answers table
CREATE TABLE public.quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.scheduled_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_quizzes
CREATE POLICY "Admin can manage quizzes" ON public.scheduled_quizzes
  FOR ALL USING (is_admin_or_pengurus(auth.uid()));

CREATE POLICY "Authenticated can view active quizzes" ON public.scheduled_quizzes
  FOR SELECT USING (is_active = true OR is_admin_or_pengurus(auth.uid()));

-- RLS Policies for quiz_questions
CREATE POLICY "Admin can manage questions" ON public.quiz_questions
  FOR ALL USING (is_admin_or_pengurus(auth.uid()));

CREATE POLICY "Users can view questions of active quizzes" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scheduled_quizzes 
      WHERE id = quiz_id AND (is_active = true OR is_admin_or_pengurus(auth.uid()))
    )
  );

-- RLS Policies for quiz_attempts
CREATE POLICY "Admin can view all attempts" ON public.quiz_attempts
  FOR SELECT USING (is_admin_or_pengurus(auth.uid()));

CREATE POLICY "Users can manage own attempts" ON public.quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for quiz_answers
CREATE POLICY "Admin can view all answers" ON public.quiz_answers
  FOR SELECT USING (is_admin_or_pengurus(auth.uid()));

CREATE POLICY "Users can manage own answers" ON public.quiz_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts 
      WHERE id = attempt_id AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX idx_quiz_answers_attempt_id ON public.quiz_answers(attempt_id);

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_quizzes_updated_at
  BEFORE UPDATE ON public.scheduled_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();