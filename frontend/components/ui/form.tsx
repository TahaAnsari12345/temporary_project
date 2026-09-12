"use client"

import * as React from "react"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "cn"

const Form = FormProvider

const FormFieldContext = React.createContext<{ name?: string }>({})

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-2", className)} {...props} />
}

function FormLabel({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-slate-700", className)} {...props} />
}

function FormControl({ children }: { children: React.ReactElement }) {
  return children
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-slate-500", className)} {...props} />
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { getFieldState } = useFormContext()
  const { name } = React.useContext(FormFieldContext)
  const message = name ? getFieldState(name).error?.message : undefined

  if (!message) return null

  return <p className={cn("text-sm font-medium text-destructive", className)} {...props}>{message}</p>
}

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage }