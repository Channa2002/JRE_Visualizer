package com.channa.jrepro.service;

import org.springframework.stereotype.Service;
import java.util.*;
 
/**
 * Provides curated preset Java code examples for the visualizer.
 */
@Service
public class ExamplesService {
 
    public record PresetExample(String id, String title, String description, String category, String code) {}
 
    private static final List<PresetExample> EXAMPLES = List.of(
 
        new PresetExample(
            "primitives",
            "Primitive Variables",
            "Demonstrates how int, double, boolean, and char are stored directly on the stack.",
            "Stack",
            """
            public class PrimitivesDemo {
                public static void main(String[] args) {
                    int age = 25;
                    double salary = 75000.50;
                    boolean isActive = true;
                    char grade = 'A';
                    age = age + 1;
                    System.out.println(age);
                }
            }
            """
        ),
 
        new PresetExample(
            "objects",
            "Object Creation on Heap",
            "Shows how objects are allocated on the heap with stack references.",
            "Heap",
            """
            public class Dog {
                String name;
                int age;
 
                public static void main(String[] args) {
                    Dog rex = new Dog("Rex", 3);
                    Dog buddy = new Dog("Buddy", 5);
                    System.out.println(rex.name);
                    System.out.println(buddy.age);
                }
            }
            """
        ),
 
        new PresetExample(
            "method_calls",
            "Method Call Stack",
            "Visualizes stack frame push/pop during method invocations.",
            "Stack",
            """
            public class Calculator {
                public static void main(String[] args) {
                    int x = 10;
                    int y = 20;
                    int result = add(x, y);
                    System.out.println(result);
                }
 
                public static int add(int a, int b) {
                    int sum = a + b;
                    return sum;
                }
            }
            """
        ),
 
        new PresetExample(
            "static_fields",
            "Static Fields in Metaspace",
            "Demonstrates static variables and constants stored in Metaspace.",
            "Metaspace",
            """
            public class MathConstants {
                static final double PI = 3.14159;
                static int instanceCount = 0;
 
                public static void main(String[] args) {
                    instanceCount = instanceCount + 1;
                    double radius = 5.0;
                    double area = PI * radius * radius;
                    System.out.println(area);
                }
            }
            """
        ),
 
        new PresetExample(
            "string_pool",
            "Strings & Heap",
            "Shows how String objects are allocated on the heap.",
            "Heap",
            """
            public class StringDemo {
                public static void main(String[] args) {
                    String firstName = new String("Alice");
                    String lastName = new String("Smith");
                    int age = 30;
                    String message = new String("Hello");
                    System.out.println(firstName);
                }
            }
            """
        ),
 
        new PresetExample(
            "linked_list_node",
            "Linked List Node",
            "Visualizes heap objects referencing each other (linked structure).",
            "Heap",
            """
            public class Node {
                int value;
                Node next;
 
                public static void main(String[] args) {
                    Node head = new Node(1, null);
                    Node second = new Node(2, null);
                    Node third = new Node(3, null);
                    int x = head.value;
                    System.out.println(x);
                }
            }
            """
        )
    );
 
    public List<PresetExample> getAll() {
        return EXAMPLES;
    }
 
    public Optional<PresetExample> findById(String id) {
        return EXAMPLES.stream().filter(e -> e.id().equals(id)).findFirst();
    }
}
 
