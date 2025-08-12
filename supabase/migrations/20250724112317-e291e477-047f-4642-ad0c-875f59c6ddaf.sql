-- Add new fields to farms table for agent management
ALTER TABLE public.farms 
ADD COLUMN IF NOT EXISTS farm_stage text,
ADD COLUMN IF NOT EXISTS number_of_fish integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS number_of_chicken integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS farm_start_date date;

-- Create RLS policy for agents to view orders from their assigned farmers
CREATE POLICY "Agents can view orders from assigned farmers" 
ON public.orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = orders.farmer_id 
    AND p.assigned_agent_id = auth.uid()
  )
);

-- Create RLS policy for agents to update orders from their assigned farmers
CREATE POLICY "Agents can update orders from assigned farmers" 
ON public.orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = orders.farmer_id 
    AND p.assigned_agent_id = auth.uid()
  )
);

-- Create RLS policy for agents to view farms of their assigned farmers
CREATE POLICY "Agents can view farms of assigned farmers" 
ON public.farms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = farms.farmer_id 
    AND p.assigned_agent_id = auth.uid()
  )
);

-- Create RLS policy for agents to update farms of their assigned farmers
CREATE POLICY "Agents can update farms of assigned farmers" 
ON public.farms 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = farms.farmer_id 
    AND p.assigned_agent_id = auth.uid()
  )
);

-- Create RLS policy for agents to view profiles of their assigned farmers
CREATE POLICY "Agents can view assigned farmer profiles" 
ON public.profiles 
FOR SELECT 
USING (
  assigned_agent_id = auth.uid() OR auth.uid() = id
);