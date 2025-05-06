import { Fieldset, Stack, Field, Input, Checkbox, Textarea, Button } from "@chakra-ui/react"
import { Tool } from "@modelcontextprotocol/sdk/types.js"
import { useState, useEffect } from "react"
import { JsonSchemaType, generateDefaultValue } from "../utils/jsonUtils"

type ToolFormProps = {
    tool: Tool,
    callTool: (toolName: string, parameters: Record<string, unknown>) => Promise<void>
}

const ToolForm = ({ 
    tool, 
    callTool, 
}: ToolFormProps) => {
        const [params, setParams] = useState<Record<string, unknown>>({}) 
        const [isToolRunning, setIsToolRunning] = useState(false)

    useEffect(() => {
        console.log("Selected Tool", tool)
        const params = Object.entries(tool?.inputSchema.properties ?? []).map(([key, value]) => [key, generateDefaultValue(value as JsonSchemaType)])
        setParams(Object.fromEntries(params))
    }, [tool])

    return (
        <>
        <Fieldset.Root size="lg">
            <Stack>
                <Fieldset.Legend fontSize="2xl">{tool.name}</Fieldset.Legend>
                <Fieldset.HelperText>{`Enter parameters for [${tool.name}]`}</Fieldset.HelperText>
            </Stack>

            <Fieldset.Content>
            <Stack gap={6} maxW="500px" w="100%">
                {Object.entries(tool.inputSchema.properties ?? []).map(([key, value]) => {
                    const prop = value as JsonSchemaType
                    return (
                        <Field.Root key={key}>
                            <Field.Label fontSize="lg" fontWeight="bold">{key}</Field.Label>
                            {prop.type === "string" ? (
                                <Input type="text" value={params[key] as string ?? ""} onChange={(e) => setParams({ ...params, [key]: e.target.value })} size="lg"
                                fontSize="lg"
                                p={4}
                                borderWidth={2}
                                borderColor="gray.400"
                                _focus={{ borderColor: "blue.500", boxShadow: "outline" }}
                                bg="white"
                                maxW="100%"/>
                            ) : prop.type === "number" || prop.type === "integer" ? (
                                <Input type="number" value={params[key] as number ?? 0} onChange={(e) => setParams({ ...params, [key]: Number(e.target.value) })} fontSize="lg"
                                p={4}
                                borderWidth={2}
                                borderColor="gray.400"
                                _focus={{ borderColor: "blue.500", boxShadow: "outline" }}
                                bg="white"
                                maxW="100%"/>
                            ) : prop.type === "boolean" ? (
                                <Checkbox.Root checked={params[key] as boolean} onCheckedChange={(checked) => setParams({ ...params, [key]: checked })}>
                                    <Checkbox.HiddenInput />
                                    <Checkbox.Control />
                                </Checkbox.Root>
                            ) : prop.type === "array" || prop.type === "object" ? (
                                <Textarea value={params[key] as string ?? ""} onChange={(e) => setParams({ ...params, [key]: e.target.value })} fontSize="lg"
                                p={4}
                                borderWidth={2}
                                borderColor="gray.400"
                                _focus={{ borderColor: "blue.500", boxShadow: "outline" }}
                                bg="white"
                                maxW="100%"/>
                            ) : null} 
                        </Field.Root>
                    )
                })}
            </Stack>
            </Fieldset.Content>
        </Fieldset.Root>
        <Button colorPalette="green" size="lg" onClick={ async () => {
            try {
                setIsToolRunning(true)
                await callTool(tool.name, params)
                setIsToolRunning(false)
            } catch (error) {
                console.error(error)
                setIsToolRunning(false)
            }
        }} loading={isToolRunning} loadingText="Running...">Run</Button>
        </>
    )
}

export default ToolForm;