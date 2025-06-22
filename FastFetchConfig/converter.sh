#!/bin/bash
#!/bin/bash
for file in *.jpg; do
    # Check if the file exists (to avoid errors if no .jpg files are found)
    if [ -f "$file" ]; then
        # Rename the file to .png
        mv "$file" "${file%.jpg}.png"
    fi
done
